"""
Face detection and analysis module using MediaPipe.
Handles face detection, landmark extraction, and pose estimation.
"""

import cv2
import numpy as np
import mediapipe as mp


class FaceAnalyzer:
    """Handles face detection and landmark extraction using MediaPipe."""
    
    def __init__(self, model_name='buffalo_l', providers=None):
        """
        Initialize the FaceAnalyzer with MediaPipe model.
        
        Args:
            model_name (str): Kept for compatibility (not used with MediaPipe)
            providers (list): Kept for compatibility (not used with MediaPipe)
        """
        try:
            # Initialize MediaPipe Face Detection and Face Mesh
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_face_mesh = mp.solutions.face_mesh
            self.mp_drawing = mp.solutions.drawing_utils
            
            # Face detection for bbox
            self.face_detection = self.mp_face_detection.FaceDetection(
                model_selection=1,  # Full range model (better for passport photos)
                min_detection_confidence=0.7
            )
            
            # Face mesh for landmarks
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=2,  # Allow detecting up to 2 faces to catch multiple face errors
                refine_landmarks=True,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            
            print("FaceAnalyzer: MediaPipe model loaded successfully.")
        except Exception as e:
            print(f"FaceAnalyzer Error: Initializing MediaPipe failed: {e}")
            raise

    def _create_face_object(self, detection_result, mesh_result, image_shape):
        """
        Create a face object compatible with the existing validation code.
        
        Args:
            detection_result: MediaPipe detection result
            mesh_result: MediaPipe mesh result  
            image_shape: Original image shape (h, w, c)
            
        Returns:
            Object with bbox, landmarks, and pose attributes
        """
        h, w = image_shape[:2]
        
        # Create face object
        class FaceData:
            def __init__(self):
                self.bbox = None
                self.kps = None  # Key points (landmarks)
                self.pose = None  # Head pose estimation
                
        face = FaceData()
        
        # Extract bounding box from detection
        if detection_result.detections:
            detection = detection_result.detections[0]
            bbox = detection.location_data.relative_bounding_box
            
            # Convert relative coordinates to absolute
            x1 = int(bbox.xmin * w)
            y1 = int(bbox.ymin * h)
            x2 = int((bbox.xmin + bbox.width) * w)
            y2 = int((bbox.ymin + bbox.height) * h)
            
            face.bbox = np.array([x1, y1, x2, y2])
        
        # Extract landmarks from mesh
        if mesh_result.multi_face_landmarks and face.bbox is not None:
            landmarks = mesh_result.multi_face_landmarks[0]
            
            # Convert MediaPipe landmarks to format expected by validation code
            # MediaPipe has 468 landmarks, we'll extract key points similar to InsightFace
            landmark_points = []
            for landmark in landmarks.landmark:
                x = int(landmark.x * w)
                y = int(landmark.y * h)
                landmark_points.append([x, y])
            
            # Create key points array (similar to InsightFace format)
            # We'll extract specific landmarks that correspond to facial features
            face.kps = np.array(landmark_points)
            
            # Simple pose estimation based on facial landmarks
            # Get nose tip, chin, left/right temples for basic pose estimation
            nose_tip = np.array([landmarks.landmark[1].x * w, landmarks.landmark[1].y * h])
            chin = np.array([landmarks.landmark[152].x * w, landmarks.landmark[152].y * h])
            left_temple = np.array([landmarks.landmark[234].x * w, landmarks.landmark[234].y * h])
            right_temple = np.array([landmarks.landmark[454].x * w, landmarks.landmark[454].y * h])
            
            # Calculate basic pose angles
            # This is a simplified estimation compared to InsightFace
            face_center = (nose_tip + chin) / 2
            temple_center = (left_temple + right_temple) / 2
            
            # Rough yaw estimation based on horizontal position of nose relative to temple center
            yaw = np.arctan2(nose_tip[0] - temple_center[0], abs(nose_tip[1] - temple_center[1])) * 180 / np.pi
            
            # Rough pitch estimation based on vertical position of nose relative to chin
            pitch = np.arctan2(nose_tip[1] - chin[1], abs(nose_tip[0] - chin[0])) * 180 / np.pi
            
            # Rough roll estimation based on temple alignment
            roll = np.arctan2(right_temple[1] - left_temple[1], right_temple[0] - left_temple[0]) * 180 / np.pi
            
            face.pose = np.array([yaw, pitch, roll])
        
        return face

    def analyze_image(self, image_bgr):
        """
        Analyzes faces in an image.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            
        Returns:
            list: List of detected faces with landmarks and pose information
        """
        if image_bgr is None:
            return None
        
        try:
            # Convert BGR to RGB for MediaPipe
            image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            
            # Run face detection
            detection_results = self.face_detection.process(image_rgb)
            
            # Run face mesh for landmarks
            mesh_results = self.face_mesh.process(image_rgb)
            
            faces = []
            if detection_results.detections:
                # For now, only process the first detected face
                face = self._create_face_object(detection_results, mesh_results, image_bgr.shape)
                if face.bbox is not None:
                    faces.append(face)
            
            return faces
            
        except Exception as e:
            print(f"FaceAnalyzer Error: Could not process image: {e}")
            return None

    def quick_check(self, image_bgr, max_dim=320):
        """
        Performs a fast check on a downscaled image to find faces.
        
        Args:
            image_bgr (numpy.ndarray): Input image in BGR format
            max_dim (int): Maximum dimension for downscaling
            
        Returns:
            list: List of detected faces on the downscaled image
        """
        h, w = image_bgr.shape[:2]
        scale = max_dim / max(h, w)
        
        if scale < 1:
            # Downscale the image for faster processing
            dsize = (int(w * scale), int(h * scale))
            image_small = cv2.resize(image_bgr, dsize, interpolation=cv2.INTER_AREA)
        else:
            image_small = image_bgr
        
        return self.analyze_image(image_small) 